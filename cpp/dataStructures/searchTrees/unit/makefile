IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-util.a ${LDIR}/lib-ds.a

CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 

XFILES = testBstSet testBalBstSet testSaBstSet testTreeMap testSaTreeMap

.cpp.o :
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : ${XFILES}

testBstSet: testBstSet.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testBalBstSet: testBalBstSet.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testSaBstSet: testSaBstSet.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testTreeMap: testTreeMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testSaTreeMap: testSaTreeMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
