IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

CXXFLAGS = -Wall -O2 -m64 -std=c++0x

%.o : %.cpp
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : testHeap_d testHeap_dd testDheaps testMheaps_f testMheaps_l

testHeap_d: testHeap_d.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testHeap_dd: testHeap_dd.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testDheaps: testDheaps.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testMheaps_f: testMheaps_f.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testMheaps_l: testMheaps_l.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
