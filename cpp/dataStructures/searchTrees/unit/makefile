IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-util.a ${LDIR}/lib-ds.a

CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 

XFILES = testSsets testSsets_rbt testSsets_sat testMap_sat testMap_rbt

.cpp.o :
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : ${XFILES}

testSsets: testSsets.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testSsets_rbt: testSsets_rbt.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testSsets_sat: testSsets_sat.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testMap_sat: testMap_sat.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testMap_rbt: testMap_rbt.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
