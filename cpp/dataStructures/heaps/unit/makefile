IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

CXXFLAGS = -Wall -O2 -m64 -std=c++0x

%.o : %.cpp
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : testHeap_d testHeap_dd testDjheaps_d testDjheaps_f testDjheaps_l

testHeap_d: testHeap_d.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testHeap_dd: testHeap_dd.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testDjheaps_d: testDjheaps_d.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testDjheaps_f: testDjheaps_f.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testDjheaps_l: testDjheaps_l.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
